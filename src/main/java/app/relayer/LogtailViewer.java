package app.relayer;

import com.aspectran.core.activity.Translet;
import com.aspectran.core.component.bean.annotation.Action;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.Dispatch;
import com.aspectran.core.component.bean.annotation.Request;
import com.aspectran.core.component.bean.annotation.Required;
import com.aspectran.core.util.logging.Logger;
import com.aspectran.core.util.logging.LoggerFactory;
import com.aspectran.core.util.security.InvalidPBTokenException;
import com.aspectran.core.util.security.TimeLimitedPBTokenIssuer;
import com.aspectran.web.activity.response.DefaultRestResponse;
import com.aspectran.web.activity.response.RestResponse;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * <p>Created: 2020/02/23</p>
 */
@Component
public class LogtailViewer {

    private static final Logger logger = LoggerFactory.getLogger(LogtailViewer.class);

    private static final String ENDPOINT_CONFIG_FILE = "/config/endpoint-config.apon";

    @Request("/${endpoint}")
    @Dispatch("templates/frame")
    @Action("page")
    public Map<String, String> viewer(String endpoint) {
        Map<String, String> map = new HashMap<>();
        map.put("include", "logtail/viewer");
        map.put("style", "fluid compact");
        map.put("token", TimeLimitedPBTokenIssuer.getToken());
        if (endpoint != null) {
            map.put("endpoint", endpoint);
        }
        return map;
    }

    @Request("/endpoints/${token}")
    public RestResponse getEndpoints(Translet translet, @Required String token) throws IOException {
        try {
            TimeLimitedPBTokenIssuer.validate(token);
        } catch (InvalidPBTokenException e) {
            if (logger.isDebugEnabled()) {
                logger.debug(e);
            }
            return new DefaultRestResponse().forbidden();
        }
        File file = translet.getApplicationAdapter().toRealPathAsFile(ENDPOINT_CONFIG_FILE);
        EndpointConfig endpointConfig = new EndpointConfig(file);
        List<EndpointInfo> endpointInfoList = endpointConfig.getEndpointInfoList();
        for (EndpointInfo endpointInfo : endpointInfoList) {
            String url = endpointInfo.getUrl();
            if (!url.endsWith("/")) {
                url += "/";
            }
            url += TimeLimitedPBTokenIssuer.getToken();
            endpointInfo.setUrl(url);
        }
        return new DefaultRestResponse(endpointInfoList).ok();
    }

}
